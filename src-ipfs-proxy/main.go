package main

import (
	"bytes"
	"flag"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	"github.com/google/uuid"
)

type AppConfig struct {
	ListenAddr   string
	AllowOrigins string
	ProxyService string
	SiteBase     string
}

type PublishResult struct {
	Id string `json:"id"`
}

func NewApplication(appConfig *AppConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit:             400 * 1024 * 1024,
		DisableStartupMessage: true,
	})
	app.Use(logger.New())

	proxyMiddleware := proxy.Balancer(proxy.Config{
		Next: func(c *fiber.Ctx) bool {
			reqPathBytes := c.Request().URI().Path()

			if bytes.HasPrefix(reqPathBytes, []byte("/api")) {
				// This is kubo RPC API request, need to split publish request out for special processing
				if bytes.HasPrefix(reqPathBytes, []byte("/api/v0/name/publish")) {
					return true
				} else {
					return false
				}
			} else {
				// This is static file requests, pass through to next handler
				return true
			}
		},
		Timeout: 60 * time.Second,
		Servers: []string{appConfig.ProxyService},
		ModifyResponse: func(c *fiber.Ctx) error {
			c.Response().Header.Set("Access-Control-Allow-Origin", appConfig.AllowOrigins)
			c.Response().Header.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			//c.Response().Header.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
			return nil
		},
	})

	corsConfig := cors.Config{
		AllowOrigins: appConfig.AllowOrigins,
	}

	app.Use(cors.New(corsConfig)).Use(proxyMiddleware).
		Post("/api/v0/name/publish", func(ctx *fiber.Ctx) error {
			// IPFS publish request, the proxy will push this request to a worker queue and return an uniq publish ID
			// Client can query whether the publishing task has been finished with the ID returned in this request
			pubTaskId := uuid.NewString()
			pubResp := PublishResult{Id: pubTaskId}

			// TODO: Add this publish task ID into queue, and
			return ctx.JSON(pubResp)
		}).
		Get("/pubtask/:id", func(ctx *fiber.Ctx) error {
			return ctx.SendString(fmt.Sprintf("This is publish handler, got querying for id: %s", ctx.Params("id")))
		}).
		Static("/", appConfig.SiteBase, fiber.Static{
			Compress:      true,
			ByteRange:     true,
			Browse:        true,
			Index:         "john.html",
			CacheDuration: 10 * time.Second,
			MaxAge:        3600,
		})

	return app
}

func main() {
	appConfig := &AppConfig{}

	flag.StringVar(&appConfig.ListenAddr, "listen-addr", ":12345", "proxy listen address")
	flag.StringVar(&appConfig.AllowOrigins, "allow-origin", "http://localhost:1420", "Allow origins, ")
	flag.StringVar(&appConfig.ProxyService, "proxy-service", "http://localhost:5001", "Proxy service address")
	flag.StringVar(&appConfig.SiteBase, "sites-base", "./", "base directory of sites")
	flag.Parse()

	log.Printf("site base dir: %s\n", appConfig.SiteBase)

	app := NewApplication(appConfig)
	app.Listen(appConfig.ListenAddr)
}

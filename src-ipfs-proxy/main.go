package main

import (
	"bytes"
	"flag"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

type AppConfig struct {
	ListenAddr   string
	AllowOrigins string
	IpfsService  string
	SiteBase     string
}

type PublishResult struct {
	Id string `json:"id"`
}

func NewApplication(appConfig *AppConfig) *fiber.App {
	publisherWorker := NewPublisherWorker(appConfig.IpfsService)
	go publisherWorker.Start()

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
		Servers: []string{appConfig.IpfsService},
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
			pubKey := ctx.Query("key")
			ipfsPath := ctx.Query("arg")
			log.Printf("pubkey: %s, ipfsPath: %s\n", pubKey, ipfsPath)
			pubTaskId := publisherWorker.AddTask(pubKey, ipfsPath)
			pubResp := PublishResult{Id: pubTaskId}
			return ctx.JSON(pubResp)
		}).
		Get("/pubtask/:id", func(ctx *fiber.Ctx) error {
			taskId := ctx.Params("id")
			respData := map[string]string{
				"ipns_path": publisherWorker.TaskIpnsPath(taskId),
			}
			return ctx.JSON(respData)
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
	flag.StringVar(&appConfig.IpfsService, "ipfs-service", "http://localhost:5001", "IPFS RPC service address")
	flag.StringVar(&appConfig.SiteBase, "sites-base", "./", "base directory of sites")
	flag.Parse()

	log.Printf("site base dir: %s\n", appConfig.SiteBase)

	app := NewApplication(appConfig)
	app.Listen(appConfig.ListenAddr)
}

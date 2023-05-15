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
	ProxyService string
	SiteBase     string
}

func NewApplication(appConfig *AppConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit:             400 * 1024 * 1024,
		DisableStartupMessage: true,
	})
	app.Use(logger.New())

	proxyMiddleware := proxy.Balancer(proxy.Config{
		Next: func(c *fiber.Ctx) bool {
			log.Printf("IPFSProxy: req path: %q\n", c.Request().URI().Path())
			log.Printf("Proxy services: %+v\n", appConfig.ProxyService)
			return !bytes.HasPrefix(c.Request().URI().Path(), []byte("/api"))
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

	app.Use(cors.New(corsConfig)).Use(proxyMiddleware).Static("/", appConfig.SiteBase, fiber.Static{
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

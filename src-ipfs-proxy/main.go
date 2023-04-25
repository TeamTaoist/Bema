package main

import (
	"bytes"
	"flag"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

func main() {
	listenAddr := flag.String("listen-addr", ":12345", "proxy listen address")
	allowOrigins := flag.String("allow-origin", "http://localhost:1420", "Allow origins, ")
	proxyService := flag.String("proxy-service", "http://localhost:5001", "Proxy service address")
	siteBase := flag.String("sites-base", "./", "base directory of sites")
	flag.Parse()

	fmt.Printf("site base dir: %s\n", *siteBase)

	app := fiber.New(fiber.Config{
		BodyLimit: 400 * 1024 * 1024,
	})

	proxyMiddleware := proxy.Balancer(proxy.Config{
		// If request header contains
		Next: func(c *fiber.Ctx) bool {
			fmt.Printf("IPFSProxy: req path: %q\n", c.Request().URI().Path())
			return !bytes.HasPrefix(c.Request().URI().Path(), []byte("/api"))
		},
		Timeout: 60 * time.Second,
		Servers: []string{*proxyService},
		ModifyResponse: func(c *fiber.Ctx) error {
			c.Response().Header.Set("Access-Control-Allow-Origin", *allowOrigins)
			c.Response().Header.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			//c.Response().Header.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
			return nil
		},
	})

	corsConfig := cors.Config{
		AllowOrigins: *allowOrigins,
	}

	app.Use(cors.New(corsConfig)).Use(proxyMiddleware).Static("/", *siteBase, fiber.Static{
		Compress:      true,
		ByteRange:     true,
		Browse:        true,
		Index:         "john.html",
		CacheDuration: 10 * time.Second,
		MaxAge:        3600,
	})

	app.Listen(*listenAddr)
}

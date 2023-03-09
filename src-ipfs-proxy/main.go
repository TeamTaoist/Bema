package main

import (
	"flag"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

func main() {
	listenAddr := flag.String("listen-addr", ":12345", "proxy listen address")
	allowOrigins := flag.String("allow-origin", "http://localhost:1420", "Allow origins, ")
	proxyService := flag.String("proxy-service", "http://localhost:5001", "Proxy service address")
	flag.Parse()

	app := fiber.New(fiber.Config{
		BodyLimit: 400*1024*1024,
	})

	proxyMiddleware := proxy.Balancer(proxy.Config{
		Servers: []string{*proxyService},
		ModifyResponse: func(c *fiber.Ctx) error {
			c.Response().Header.Set("Access-Control-Allow-Origin", *allowOrigins)
			c.Response().Header.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			//c.Response().Header.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
			return nil
		},
	})

	app.Use(proxyMiddleware)

	//corsConfig := cors.Config{
	//	AllowOrigins: *allowOrigins,
	//}
	//
	//app.Use(cors.New(corsConfig))
	//
	//app.Use("/", func(c *fiber.Ctx) {

	//
	//	// Call the proxy middleware
	//	proxyMiddleware(c)
	//})

	app.Listen(*listenAddr)
}

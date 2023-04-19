all: build build-m1

PLATFORM:=$(shell rustc -Vv | grep host | cut -f2 -d' ')
BINARY_NAME:=ipfs_proxy
BINARY_NAME_M1:=ipfs_proxy-aarch64-apple-darwin

build:
	go build -o $(BINARY_NAME) ./...
	cp $(BINARY_NAME) ../src-tauri/binaries/$(BINARY_NAME)-$(PLATFORM)

build-m1:
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY_NAME_M1) ./...
	cp $(BINARY_NAME_M1) ../src-tauri/binaries/

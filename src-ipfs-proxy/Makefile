all: build

PLATFORM:=$(shell rustc -Vv | grep host | cut -f2 -d' ')
BINARY_NAME:=ipfs_proxy

build:
	go build -o $(BINARY_NAME) ./...
	cp $(BINARY_NAME) ../src-tauri/binaries/$(BINARY_NAME)-$(PLATFORM)
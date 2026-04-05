.PHONY: dev test build

dev:
	go run .

test:
	go vet ./... && go test -v ./...

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/server .

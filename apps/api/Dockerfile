FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /server .

FROM golang:1.24-alpine AS dev
COPY --from=build /server /server
CMD ["/server"]

FROM gcr.io/distroless/static-debian12
COPY --from=build /server /server
USER nonroot:nonroot
CMD ["/server"]

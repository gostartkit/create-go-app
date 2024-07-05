# create-go-app

help you create go app with app-stub template.

### npx

```bash
npx create-go-app demo
```

### yarn

```bash
yarn create go-app demo
```

### pnpm

```bash
pnpm create go-app demo
```

```bash
pnpm dlx create-go-app demo
```

## About demo app

1. Build from source

```bash
go build -ldflags "-s -w" -buildmode=exe -tags release -o bin/demo
```

2. Create config

```bash
bin/demo config
```

**Note**: Please modify config.json as you need.

3. Start service

```bash
bin/demo serve
```

**Note**: Default config is use network: `unix`, you can change `network` to `tcp` and `addr` to `127.0.0.1:5000` for test.

## Getting Started

[Getting Started](https://gostartkit.com/docs/getting-started/)
.DEFAULT_GOAL := help
.NOTPARALLEL:

CHROME_BIN ?= /usr/bin/google-chrome
export CHROME_BIN

.PHONY: help install hooks doctor dev run icons store-assets build lint lint-fix format typecheck check test test-watch package release deploy deploy-local clean status

help: ## Show available terminal commands
	@awk 'BEGIN {FS = ":.*## "; printf "\nWpp Discreto development commands\n\n"} /^[a-zA-Z_-]+:.*## / {printf "  make %-13s %s\n", $$1, $$2} END {print ""}' $(MAKEFILE_LIST)

install: ## Install locked dependencies and Git hooks
	pnpm install --frozen-lockfile

hooks: ## Install or restore Lefthook Git hooks
	pnpm hooks:install

doctor: ## Check Node, pnpm, Git and the Chrome test executable
	node --version
	pnpm --version
	git --version
	"$(CHROME_BIN)" --version

dev: ## Watch extension sources and rebuild after changes
	pnpm dev

run: dev ## Start the local development workflow

icons: ## Regenerate Chrome icon sizes from the approved logo
	pnpm icons

store-assets: ## Capture fictitious demos and export Chrome Web Store assets
	pnpm store:assets

build: ## Compile the unpacked extension into dist/extension
	pnpm build

lint: ## Check formatting and lint rules with Biome
	pnpm lint

lint-fix: ## Apply safe Biome formatting and lint fixes
	pnpm lint:fix

format: ## Format supported source and configuration files
	pnpm format

typecheck: ## Check strict TypeScript types
	pnpm typecheck

check: ## Run Biome and TypeScript checks
	pnpm check

test: ## Build and run Jest, including Chrome integration tests
	pnpm test

test-watch: ## Build fixtures and run Jest in watch mode
	pnpm test:watch

package: ## Build a Chrome Web Store ZIP in dist
	pnpm package

release: check test package ## Validate and prepare a release for manual submission
	@printf '\nRelease ready in dist/. Submit the ZIP through the Chrome Web Store dashboard after manual validation.\n'

deploy: release ## Prepare a validated release for manual Chrome Web Store submission

deploy-local: build ## Build and load the extension in Chrome with a separate persistent test profile
	pnpm deploy:local

clean: ## Remove generated build output and coverage only
	pnpm clean

status: ## Show the current Git working tree
	git status --short --branch

.PHONY: help install start build start-prod test lint format knip check

export UID = $(USER_ID)
export GID = $(GROUP_ID)

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# =====================================================================
# Common commands =====================================================
# =====================================================================

install: ## Setup project
	yarn

start: ## Launch local environment
	yarn dev

build: ## Build for production
	yarn build

start-prod: ## Launch production environment
	yarn start

# =====================================================================
# Quality =============================================================
# =====================================================================

test: ## Run the test suite
	yarn test

lint: ## Lint with ESLint
	yarn lint

format: ## Format the code with Prettier
	yarn format

knip: ## Find unused files, deps and exports
	yarn knip

check: ## Run all checks (lint, format, knip, tests)
	yarn lint
	yarn format:check
	yarn knip
	yarn test

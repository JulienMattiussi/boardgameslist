.PHONY:


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

build:
	yarn build

start-prod: ## Launch production environment
	yarn start

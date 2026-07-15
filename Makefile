# NOTE: `aws login` caches credentials in a session format that only the AWS
# CLI itself understands. The lightsailctl plugin (used by `push`) is a
# separate Go binary that can't read that cache and silently falls back to
# (failing) EC2 instance-metadata lookups. To make this work regardless of
# how you signed in, every target re-exports the current CLI session as plain
# AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN env vars before running aws/lightsailctl.
SERVICE := aster-horoscope
LABEL   := app
IMAGE   := $(SERVICE):latest
REGION  := ap-southeast-1

AWS_ENV := eval "$$(aws configure export-credentials --format env)" &&

.PHONY: build push deploy release url logs

build:
	docker build --platform linux/amd64 -t $(IMAGE) .

push: build
	$(AWS_ENV) aws lightsail push-container-image --region $(REGION) \
		--service-name $(SERVICE) --label $(LABEL) --image $(IMAGE)

deploy:
	$(AWS_ENV) aws lightsail create-container-service-deployment --region $(REGION) \
		--service-name $(SERVICE) \
		--containers file://deploy/containers.json \
		--public-endpoint file://deploy/public-endpoint.json

release: push deploy

url:
	$(AWS_ENV) aws lightsail get-container-services --region $(REGION) \
		--service-name $(SERVICE) --query 'containerServices[0].url' --output text

logs:
	$(AWS_ENV) aws lightsail get-container-log --region $(REGION) \
		--service-name $(SERVICE) --container-name $(LABEL)

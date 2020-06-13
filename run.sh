(docker network create --attachable galaxyvictor_network || true ) &&

(docker container rm gv-server-civilizations -f || true ) &&


docker build --rm -f "Dockerfile" -t binarysearch/gv-server-civilizations:latest . &&
docker run -p 3001:3001 -e LISTEN_PORT=3001 -e PIROS_STATUS_SERVER_HOST=galaxyvictor-server-status -e PIROS_STATUS_SERVER_PORT=12345 -e PIROS_STATUS_SERVICE_NAME=gv-server-civilizations -e POD_IP=1.1.1.1 -e POSTGRES_USERNAME=postgres -e POSTGRES_DATABASE=postgres -e POSTGRES_PASSWORD=12345 -e POSTGRES_PORT=5432 -e POSTGRES_HOST=db --name=gv-server-civilizations --network=galaxyvictor_network binarysearch/gv-server-civilizations:latest
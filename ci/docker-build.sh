
#!/usr/bin/env bash
set -e

name="docker-registry-write.iotdomu.cz/iot-platform/zigbee"
hash=$(git rev-parse --short HEAD)
docker build -t $name:$hash -t $name:latest --progress plain .

docker push $name:$hash
docker push $name:latest
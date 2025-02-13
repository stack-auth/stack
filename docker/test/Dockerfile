FROM alpine:latest

# Install socat and curl
RUN apk add --no-cache socat curl

# Use a heredoc to create the entrypoint script
RUN cat <<'EOF' > /entrypoint.sh
#!/bin/sh
echo "Starting proxy: forwarding container localhost:8114 to host host.docker.internal:8114"
socat TCP-LISTEN:8114,fork,reuseaddr TCP:host.docker.internal:8114 &
# Give socat a moment to start
sleep 2
echo "Fetching from localhost:8114:"
curl -v http://127.0.0.1:8114
EOF

# Make the script executable
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

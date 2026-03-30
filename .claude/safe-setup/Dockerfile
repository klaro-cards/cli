FROM alpine:latest

# Install packages: base tools, node, ruby, postgresql client
RUN apk update && apk add --no-cache \
    bash \
    curl \
    git \
    build-base \
    nodejs \
    npm \
    vim \
    ruby \
    sudo

# Create non-root user with sudo access
RUN addgroup -S claude && adduser -S claude -G claude \
    && echo "claude ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create wrapper script 'c' that adds dangerous permissions flag
RUN echo '#!/bin/bash' > /usr/local/bin/c && \
    echo 'exec claude --dangerously-skip-permissions "$@"' >> /usr/local/bin/c && \
    chmod +x /usr/local/bin/c

# Set up working directory
WORKDIR /workspace

# Copy and set up entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER claude

# Install Claude Code CLI globally
RUN curl -fsSL https://claude.ai/install.sh -o /tmp/install.sh \
    && chmod +x /tmp/install.sh \
    && bash /tmp/install.sh \
    && rm /tmp/install.sh
ENV PATH="/home/claude/.local/bin:$PATH"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]

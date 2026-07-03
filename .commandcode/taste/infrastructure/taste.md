# infrastructure
- Use multi-stage Dockerfile (Node.js/Next.js): deps → builder → runner with non-root user, standalone output, ~150MB final image. Confidence: 0.95
- Use Docker Compose with services bound to 127.0.0.1 only (not 0.0.0.0) to prevent UFW bypass. Confidence: 0.95
- After UFW-Docker patch installed: explicitly allow port routes via "sudo ufw route allow proto tcp from any to any port 80/443". Confidence: 0.95
- VPS hardening checklist: non-root user, SSH hardening (no root, no password auth), UFW firewall, Fail2Ban, unattended-upgrades, fix Docker UFW bypass. Confidence: 0.95
- CI pipeline: lint → tsc --noEmit → test → build on every PR to main; deploy via SSH action or git pull + docker compose up --build on VPS. Confidence: 0.95
- Store .env.production on server only; never push secrets to GitHub. Confidence: 0.95

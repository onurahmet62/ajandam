# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --force
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /app
COPY api/ ./
RUN dotnet publish Ajandam.API/Ajandam.API.csproj -c Release -o /publish

# Stage 3: Copy frontend build into backend wwwroot
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=backend-build /publish ./
COPY --from=frontend-build /app/client/dist ./wwwroot/
# Render uses PORT env variable
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000
ENTRYPOINT ["dotnet", "Ajandam.API.dll"]

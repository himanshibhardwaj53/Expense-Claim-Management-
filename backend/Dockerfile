FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY target/claim-management-1.0.0.jar app.jar
RUN mkdir -p uploads/receipts
EXPOSE 8080
ENTRYPOINT ["java", "-Dspring.profiles.active=postgres", "-jar", "app.jar"]

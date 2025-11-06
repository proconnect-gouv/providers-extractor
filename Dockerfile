ARG MONGO_VERSION=5.0.23
FROM mongo:${MONGO_VERSION}

RUN openssl rand -base64 756 > /mongo-key-file
COPY ./db/docker-stack-ca.crt /usr/local/share/ca-certificates/
COPY ./db/mongo.pem /mongo.pem

RUN chmod 400 /mongo-key-file /mongo.pem && \
    chown mongodb:mongodb /mongo-key-file /mongo.pem && \
    update-ca-certificates

CMD [ "--replSet", "rs0", "--keyFile", "/mongo-key-file", "--enableMajorityReadConcern", \
    "--tlsMode", "requireTLS", "--tlsCertificateKeyFile", "/mongo.pem" ]

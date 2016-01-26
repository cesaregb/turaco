# To build:
# docker build -t turaco:v1 -f Dockerfile .
#
# To run:
# docker run -p 27017:27017 -d mongo
# docker run -p 3000:3000 -it turaco:v1
FROM node:0.12
MAINTAINER Cesar Gonzalez, cesareg.borjon@gmail.com

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev
RUN mkdir /myapp
WORKDIR /myapp
#ADD node_app/package.json /myapp/package.json

ADD node_app /myapp
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]

FROM nginx:latest

MAINTAINER Thomas Lant "tom@matrix.org"

RUN rm -v /etc/nginx/nginx.conf
ADD  nginx.conf /etc/nginx/

RUN apt-get update -y && \
    apt-get install -y curl gnupg

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update -y && \
    apt-get install -y yarn

WORKDIR /build
COPY . .

RUN yarn && yarn build

RUN cp -r /build/build/* /usr/share/nginx/html/

#ADD build /var/www/html/
#ADD build /usr/share/nginx/html/

FROM node:6.3.0
MAINTAINER Dan Fennell <dan.fennell.jr@gmail.com>

# non root user to run aplication
RUN useradd --user-group --create-home --shell /bin/false app &&\
npm install forever -g

ENV HOME=/home/app

COPY package.json npm-shrinkwrap.json $HOME/s2m-eng/

RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/s2m-eng


RUN npm install
CMD ["forever", "./forever/development.json"]

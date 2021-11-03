FROM amazonlinux:2.0.20200722.0
RUN /bin/bash
RUN yum install -y gcc-c++ git tar
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 14
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh" && nvm install $NODE_VERSION && echo "export NVM_DIR=/root/.nvm" >> /root/.bashrc && echo "\. $NVM_DIR/nvm.sh  # This loads nvm" >> /root/.bashrc
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/v$NODE_VERSION/bin:$PATH
CMD ["/bin/bash"]
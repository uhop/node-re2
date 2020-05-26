FROM centos:centos6

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-7-gcc devtoolset-7-gcc-c++ python27" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*' && \
    scl enable devtoolset-7 bash

# RUN [ -z "$HOME" ] && echo "HOME is set" || echo "HOME is NOT set"

# ENV NVM_DIR=$HOME/.nvm \
#     PATH=$HOME/src/bin:$HOME/bin:/opt/rh/devtoolset-6/root/usr/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
#     [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  && \
#     nvm install 10

# # Enable the SCL and NVM for all bash scripts.
# ENV BASH_ENV=$HOME/etc/enable \
#     ENV=$HOME/etc/enable \
#     PROMPT_COMMAND=". $HOME/etc/enable"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

FROM centos:centos7

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-7-make devtoolset-7-gcc devtoolset-7-gcc-c++ python27" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*'

ENV HOME=/opt/app-root \
    NVM_DIR=/opt/app-root/.nvm \
    PATH=/opt/app-root/src/bin:/opt/app-root/bin:/opt/rh/devtoolset-7/root/usr/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Copy extra files to the image.
COPY ./root/ /

RUN groupadd -r default -f -g 1001 && \
    useradd -g default default -d ${HOME} -u 1001 && \
    chown -R 1001:1001 /opt/app-root

USER 1001

WORKDIR ${HOME}

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  && \
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  && \
    nvm install 12 && \
    nvm install 14

# Enable the SCL and NVM for all bash scripts.
ENV BASH_ENV=/opt/app-root/etc/enable \
    ENV=/opt/app-root/etc/enable \
    PROMPT_COMMAND=". /opt/app-root/etc/enable"

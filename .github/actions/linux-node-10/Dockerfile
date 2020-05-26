FROM centos:centos6

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-6-gcc devtoolset-6-gcc-c++ python27" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*'

ENV HOME=/opt/app-root \
    NVM_DIR=/opt/app-root/.nvm \
    PATH=/opt/app-root/src/bin:/opt/app-root/bin:/opt/rh/devtoolset-6/root/usr/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Copy extra files to the image.
COPY enable /opt/app-root/etc/enable

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  && \
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  && \
    nvm install 10

# Enable the SCL and NVM for all bash scripts.
ENV BASH_ENV=/opt/app-root/etc/enable \
    ENV=/opt/app-root/etc/enable \
    PROMPT_COMMAND=". /opt/app-root/etc/enable"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

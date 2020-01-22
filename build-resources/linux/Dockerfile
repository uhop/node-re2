FROM centos:centos6

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-6-gcc devtoolset-6-gcc-c++ python27" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*'

ENV HOME=/opt/app-root/src \
    NVM_DIR=/opt/app-root/.nvm \
    PATH=/opt/app-root/src/bin:/opt/app-root/bin:/opt/rh/devtoolset-6/root/usr/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  && \
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  && \
    nvm install 10.18.0 && \
    npm install -g yarn

# Copy extra files to the image.
COPY ./root/ /

RUN mkdir -p ${HOME} && \
    mkdir -p ${HOME}\node-re2 && \
    groupadd -r default -f -g 1001 && \
    useradd -g default default -d ${HOME} -u 1001 && \
    chown -R 1001:1001 /opt/app-root /usr/bin/container-entrypoint /usr/bin/usage && \
    chmod u+x /usr/bin/usage

USER 1001

WORKDIR ${HOME}/node-re2

# Enable the SCL for all bash scripts.
ENV BASH_ENV=/opt/app-root/etc/scl_enable \
    ENV=/opt/app-root/etc/scl_enable \
    PROMPT_COMMAND=". /opt/app-root/etc/scl_enable"

# Set the default CMD to print the usage of the language image
ENTRYPOINT ["container-entrypoint"]
CMD ["usage"]

FROM centos:centos7

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-8 python3 make git" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*'
    #  && \
    # source scl_source enable devtoolset-8 && \
    # source scl_source enable python3

ENV PATH=/opt/rh/devtoolset-8/root/usr/bin:$PATH

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

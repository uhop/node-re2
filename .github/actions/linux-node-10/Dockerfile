FROM centos:centos6

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="devtoolset-7-gcc devtoolset-7-gcc-c++ python27" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*' && \
    scl enable devtoolset-7 bash

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

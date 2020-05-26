FROM centos:centos6

RUN yum install -y centos-release-scl && \
    INSTALL_PKGS="gcc gcc-c++ python27 python-argparse" && \
    yum install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*'

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

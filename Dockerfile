# build a docker file to run this on lambda
FROM public.ecr.aws/lambda/nodejs:14
WORKDIR ${LAMBDA_TASK_ROOT}
ADD . ${LAMBDA_TASK_ROOT}
RUN yum install -y bind-utils && yum install -y traceroute
RUN npm install
ENV AWSLAMBDA=1
CMD [ "index.handler" ]
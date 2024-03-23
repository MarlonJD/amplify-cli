import { FunctionRuntimeContributorFactory } from '@aws-amplify/amplify-function-plugin-interface';
import { checkDependencies, packageResource, buildResource } from './runtime';
import { localInvoke } from './localinvoke';
import { relativeShimSrcPath } from './constants';
import { GetPackageAssetPaths } from '@aws-amplify/amplify-cli-core';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context) => {
  return {
    contribute: (request) => {
      if (request.selection !== 'go') {
        return Promise.reject(new Error(`Unknown selection ${request.selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Go 1.x',
          value: 'provided.al2023',
          cloudTemplateValue: 'provided.al2023',
          defaultHandler: 'main',
          layerExecutablePath: 'provided.al2023',
        },
      });
    },
    checkDependencies: () => checkDependencies(),
    package: (request) => packageResource(request, context),
    build: buildResource,
    invoke: (request) => localInvoke(request, context),
  };
};

export const getPackageAssetPaths: GetPackageAssetPaths = async () => [relativeShimSrcPath];

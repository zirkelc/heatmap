const { withPodfile } = require('expo/config-plugins');

const MARKER = '# withPodsDeploymentTarget';

/**
 * Raises the deployment target of all pods to a minimum version.
 * Some pods (for example the Google Maps resource bundles) declare iOS 11 or 14,
 * which newer Xcode versions refuse to build.
 */
function withPodsDeploymentTarget(config, { deploymentTarget = '15.1' } = {}) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents;
    if (contents.includes(MARKER)) {
      return podfileConfig;
    }

    const snippet = [
      `    ${MARKER}`,
      '    installer.pods_project.targets.each do |target|',
      '      target.build_configurations.each do |build_config|',
      `        if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${deploymentTarget}`,
      `          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`,
      '        end',
      '      end',
      '    end',
    ].join('\n');

    podfileConfig.modResults.contents = contents.replace(
      /(post_install do \|installer\|\n)/,
      `$1${snippet}\n`
    );
    return podfileConfig;
  });
}

module.exports = withPodsDeploymentTarget;

import {Schema} from '@coveo/bueno';
import {
  EngineConfiguration,
  engineConfigurationDefinitions,
  getSampleEngineConfiguration,
} from '../engine-configuration';

/**
 * The product listing engine configuration.
 */
export interface ProductListingEngineConfiguration
  extends EngineConfiguration {}

export const productListingEngineConfigurationSchema =
  new Schema<ProductListingEngineConfiguration>({
    ...engineConfigurationDefinitions,
  });

/**
 * Creates a sample product listing engine configuration.
 *
 * @returns The sample product listing engine configuration.
 */
export function getSampleProductListingEngineConfiguration(): ProductListingEngineConfiguration {
  return {
    ...getSampleEngineConfiguration(),
  };
}

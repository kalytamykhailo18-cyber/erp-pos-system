import React, { useMemo } from 'react';
import type { Product } from '../../types';
import { MdStar, MdStarBorder } from 'react-icons/md';

interface SearchResultsTableProps {
  searchResults: {
    all_products: Product[];
    factory_direct: Product[];
    premium: Product[];
    count: number;
  };
}

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({ searchResults }) => {
  // Calculate price comparisons for factory-direct products
  const productsWithComparisons = useMemo(() => {
    const { all_products, premium } = searchResults;

    return all_products.map((product) => {
      if (!product.is_factory_direct || premium.length === 0) {
        return { ...product, comparison: null };
      }

      // Find similar premium product (same species, variety, similar protein)
      const similarPremium = premium.find((p) => {
        const sameSpecies = p.species_id === product.species_id;
        const sameVariety = p.variety_id === product.variety_id;
        const pProtein = p.protein_percent ? parseFloat(String(p.protein_percent)) : 0;
        const prodProtein = product.protein_percent ? parseFloat(String(product.protein_percent)) : 0;
        const similarProtein =
          p.protein_percent &&
          product.protein_percent &&
          Math.abs(pProtein - prodProtein) <= 5;

        return sameSpecies && sameVariety && similarProtein;
      });

      const productPrice = parseFloat(String(product.selling_price));
      const premiumPrice = similarPremium ? parseFloat(String(similarPremium.selling_price)) : 0;
      if (similarPremium && productPrice < premiumPrice) {
        const savings = premiumPrice - productPrice;
        const savingsPercent = Math.round((savings / premiumPrice) * 100);

        return {
          ...product,
          comparison: {
            premiumProduct: similarPremium.name,
            premiumPrice: premiumPrice,
            savings,
            savingsPercent,
          },
        };
      }

      return { ...product, comparison: null };
    });
  }, [searchResults]);

  if (searchResults.count === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No se encontraron productos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Total de productos:
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{searchResults.count}</span>
          </div>
          <div>
            <span className="font-semibold text-green-600 dark:text-green-400">
              Fábrica Directa:
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">
              {searchResults.factory_direct.length}
            </span>
          </div>
          <div>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Premium:
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">
              {searchResults.premium.length}
            </span>
          </div>
        </div>
      </div>

      <table className="w-full">
        <thead className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Especie / Variedad
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Tamaño
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Proteína
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Precio
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Comparación
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {productsWithComparisons.map((product) => (
            <tr
              key={product.id}
              className={`
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${
                  product.is_factory_direct
                    ? 'bg-green-50 dark:bg-green-900/10'
                    : 'bg-white dark:bg-gray-800'
                }
              `}
            >
              {/* Type Badge */}
              <td className="px-4 py-3 whitespace-nowrap">
                {product.is_factory_direct ? (
                  <div className="flex items-center gap-1">
                    <MdStar className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                      FÁBRICA
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <MdStarBorder className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      PREMIUM
                    </span>
                  </div>
                )}
              </td>

              {/* SKU */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {product.sku || '-'}
                </span>
              </td>

              {/* Product Name */}
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {product.name}
                </div>
                {product.short_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {product.short_name}
                  </div>
                )}
              </td>

              {/* Species / Variety */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {product.species?.name || '-'}
                </div>
                {product.variety && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {product.variety.name}
                  </div>
                )}
              </td>

              {/* Size */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {product.weight_size || '-'}
                </span>
              </td>

              {/* Protein */}
              <td className="px-4 py-3 whitespace-nowrap">
                {product.protein_percent ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {product.protein_percent}%
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>

              {/* Price */}
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ${parseFloat(String(product.selling_price)).toLocaleString('es-AR')}
                </span>
              </td>

              {/* Comparison */}
              <td className="px-4 py-3">
                {product.comparison ? (
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">
                      vs. Premium: ${parseFloat(String(product.comparison.premiumPrice)).toLocaleString('es-AR')}
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      Ahorro: ${product.comparison.savings.toLocaleString('es-AR')} (
                      {product.comparison.savingsPercent}%)
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

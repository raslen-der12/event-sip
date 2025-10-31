// src/hooks/useCountries.js
import { useEffect, useState } from 'react';
import { getCountries, FALLBACK_COUNTRIES } from '../../utils/countriesKeys';

export default function useCountries({ locale = 'en' } = {}) {
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await getCountries({ locale });
        if (!ignore) setCountries(list);
      } catch (e) {
        if (!ignore) setError(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [locale]);

  return { countries, list: countries, loading, error };
}

import { useEffect, useState } from "react";

function gql(str) {
  /**
   * Really high tech graphql parser so that VSCode and Prettier stop ignoring
   * my graphql strings.
   */
  return str[0];
}

function sanityOptionsToReactSelectOptions(sanityOptions) {
  return sanityOptions.map((sanityOption) => {
    const value = sanityOption.name.toLowerCase();
    return {
      value,
      label: sanityOption.name,
      keywords: sanityOption.keywords,
    };
  });
}

const formQuery = gql`
    fragment OptionWithKeywordFrag on OptionWithKeywords {
        name
        keywords
    }
    {
        CirForm(id: "cirForm") {
            primaryIncTypes
            locations {
                ...OptionWithKeywordFrag
            }
            programs {
                ...OptionWithKeywordFrag
            }
            immediateResponses {
                ...OptionWithKeywordFrag
            }
            servicesInvolved {
                ...OptionWithKeywordFrag
            }
        }
    }
`

export function useFormOptions() {
  const [formOptions, setFormOptions] = useState({
    incTypes: null,
    locations: null,
    programs: null,
    immediateResponses: null,
    services: null,
  });

  async function fetchFormOptions() {
      const res = await fetch(process.env.REACT_APP_SANITY_GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${process.env.REACT_APP_SANITY_READ_TOKEN}`,
          },
          body: JSON.stringify({ query: formQuery }),
      })
      const { data } = await res.json()
      const incTypes = data?.CirForm?.primaryIncTypes
      const locations = data?.CirForm?.locations
      const programs = data?.CirForm?.programs
      const immediateResponses = data?.CirForm?.immediateResponses
      const services = data?.CirForm?.servicesInvolved

      if (!incTypes) {
          return
      }
      const newFormOptions = {
          incTypes: incTypes.map((incType) => ({
              value: incType.toLowerCase(),
              label: incType,
          })),
          locations: sanityOptionsToReactSelectOptions(locations),
          programs: sanityOptionsToReactSelectOptions(programs),
          immediateResponses: sanityOptionsToReactSelectOptions(
              immediateResponses
          ),
          services: sanityOptionsToReactSelectOptions(services),
      }
      setFormOptions(newFormOptions)
  }

  // Fetch options only on component load
  useEffect(() => {
    try {
      fetchFormOptions();
    } catch (e) {
      console.log("Error fetching from Sanity:", e);
    }
  }, []);

  return formOptions;
}

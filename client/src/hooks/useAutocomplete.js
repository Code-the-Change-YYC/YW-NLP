import { useCallback, useEffect } from "react";
import chrono from "chrono-node";
import _ from "lodash";
import usePrevious from "./usePrevious";

// Checking functions
// These functions are run when the description updates and contain the logic
// for autocompleting the form fields.

const autocompleteSingleOption = (desc, options) => {
  const lowercasedDescription = desc.toLowerCase();
  return (
    options.find((option) =>
      (option.keywords || []).some((keyword) =>
        lowercasedDescription.includes(keyword.toLowerCase())
      )
    ) || null
  );
};

const autocompleteMultipleOptions = (desc, options) => {
  const lowercasedDescription = desc.toLowerCase();
  const newOptions = options.filter((option) =>
    (option.keywords || []).some((keyword) =>
      lowercasedDescription.includes(keyword.toLowerCase())
    )
  );
  return newOptions;
};

const useAutocomplete = ({
  description,
  immediateResponses,
  immediateResponse,
  services,
  locations,
  programs,
  clientInitials,
  incTypesOptions,
  setImmediateResponseAutocomplete,
  setServicesInvolvedAutocomplete,
  setLocationAutocomplete,
  setProgramAutocomplete,
  setDateOccurredAutocomplete,
  setClientInitialsAutocomplete,
  setClientSecInitialsAutocomplete,
  updateIncTypesOptions,
}) => {
  // set default immediate response to "Other"
  useEffect(() => {
    if (!immediateResponse || immediateResponse?.length === 0) {
      const otherImmediateResponse = immediateResponses?.find((response) => {
        if (response?.value) {
          return response.value.toLowerCase().includes("other");
        }
      });
      setImmediateResponseAutocomplete((prev) =>
        otherImmediateResponse ? [otherImmediateResponse] : prev
      );
    }
  }, [immediateResponses, immediateResponse, setImmediateResponseAutocomplete]);

  const checkServices = useCallback(
    (desc) => {
      if (services) {
        setServicesInvolvedAutocomplete(
          autocompleteMultipleOptions(desc, services)
        );
      }
    },
    [services, setServicesInvolvedAutocomplete]
  );

  const checkLocation = useCallback(
    (desc) => {
      if (locations) {
        setLocationAutocomplete(autocompleteSingleOption(desc, locations));
      }
    },
    [locations, setLocationAutocomplete]
  );

  const checkProgram = useCallback(
    (desc) => {
      if (programs) {
        setProgramAutocomplete(autocompleteSingleOption(desc, programs));
      }
    },
    [programs, setProgramAutocomplete]
  );

  const checkDate = useCallback(
    (desc) => {
      const results = chrono.parse(desc);

      if (results && results.length) {
        let date = results[0].start.date();
        if (date > Date.now()) {
          date = new Date();
        }
        setDateOccurredAutocomplete(date);
      }
    },
    [setDateOccurredAutocomplete]
  );

  const checkImmediateResponse = useCallback(
    (desc) => {
      if (immediateResponses) {
        setImmediateResponseAutocomplete(
          autocompleteMultipleOptions(desc, immediateResponses)
        );
      }
    },
    [immediateResponses, setImmediateResponseAutocomplete]
  );

  const checkInitials = useCallback(
    (desc) => {
      const found = desc.match(/\b(?!AM|PM)([A-Z]{2})\b/g);
      if (found && found.length) {
        setClientInitialsAutocomplete(found[0]);
      } else {
        setClientInitialsAutocomplete("");
      }
    },
    [setClientInitialsAutocomplete]
  );

  const checkSecondInitials = useCallback(
    (desc, clientInitials) => {
      if (!clientInitials) {
        return;
      }
      const found = desc.match(/\b(?!AM|PM)([A-Z]{2})\b/g);
      if (found && found.length) {
        for (const match of found) {
          if (match !== clientInitials) {
            setClientSecInitialsAutocomplete(match);
            return;
          }
        }
      }
      setClientSecInitialsAutocomplete("");
    },
    [setClientSecInitialsAutocomplete]
  );

  // run this 1000 seconds when the description is updated
  const onDescriptionUpdate = useCallback(
    _.throttle((desc, clientInitials, incTypesOptions) => {
      checkLocation(desc);
      checkInitials(desc);
      checkSecondInitials(desc, clientInitials);
      checkServices(desc);
      checkDate(desc);
      updateIncTypesOptions(desc, incTypesOptions);
      checkProgram(desc);
      checkImmediateResponse(desc);
    }, 500),
    [
      checkLocation,
      checkInitials,
      checkSecondInitials,
      checkServices,
      checkDate,
      updateIncTypesOptions,
      checkProgram,
      checkImmediateResponse,
    ]
  );

  const prevDescription = usePrevious(description);

  useEffect(() => {
    if (description !== prevDescription) {
      onDescriptionUpdate(description, clientInitials, incTypesOptions);
    }
  }, [
    description,
    prevDescription,
    clientInitials,
    incTypesOptions,
    onDescriptionUpdate,
  ]);

  return {};
};

export default useAutocomplete;

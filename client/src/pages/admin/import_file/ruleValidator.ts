export const validateRule = (tempRule, current) => {
  if (!tempRule.type) return "Please select a rule";

  if (tempRule.type === "data_type" && !tempRule.data_type) {
    return "Please select data type";
  }

  if (tempRule.type === "data_length") {
    const dataTypeRule = current.rules?.find(
      (rule) => rule.type === "data_type",
    );

    const dataType = current?.tempDataType || dataTypeRule?.value || "string";

    if (tempRule.length_mode === "fixed") {
      if (!tempRule.fixed && tempRule.fixed !== 0) {
        return dataType === "date"
          ? "Please enter fixed date"
          : "Please enter fixed value. Fixed value should be >= 0";
      }

      if (dataType === "date") {
        const fixedDate = new Date(tempRule.fixed);

        if (isNaN(fixedDate.getTime())) {
          return "Invalid date";
        }
      } else {
        // 🔢 NUMBER / LENGTH VALIDATION
        const fixedVal = Number(tempRule.fixed);

        if (isNaN(fixedVal)) {
          return "Fixed value must be a number";
        }

        if (fixedVal < 0) {
          return "Fixed value cannot be negative";
        }
      }
    } else if (tempRule.length_mode === "variable") {
      if (dataType === "date") {
        const minDate = new Date(tempRule.min);
        const maxDate = new Date(tempRule.max);

        if (!tempRule.min) {
          return "Please enter minimum date";
        }

        if (!tempRule.max) {
          return "Please enter maximum date";
        }

        if (isNaN(minDate.getTime())) {
          return "Invalid minimum date";
        }

        if (isNaN(maxDate.getTime())) {
          return "Invalid maximum date";
        }

        if (minDate > maxDate) {
          return "Minimum date cannot be greater than maximum date";
        }
      } else {
        const minVal = Number(tempRule.min);
        const maxVal = Number(tempRule.max);

        if (tempRule.min === "" || tempRule.min === undefined) {
          return "Please enter minimum value. Minimum value should be >= 0";
        }

        if (tempRule.max === "" || tempRule.max === undefined) {
          return "Please enter maximum value. Maximum value should be >= 0";
        }

        if (isNaN(minVal) || minVal < 0) {
          return "Minimum value must be >= 0";
        }

        if (isNaN(maxVal) || maxVal < 0) {
          return "Maximum value must be >= 0";
        }
        if (minVal >= maxVal) {
          return "Minimum value cannot be same or greater than maximum value";
        }
      }
    }
  }

  // DATE FORMAT VALIDATION
  if (tempRule.type === "date_format" && !tempRule.date_format) {
    return "Please select date format";
  }
  ///
  if (tempRule.type === "data_type" && tempRule.date_format === "custom") {
    // ✅ CUSTOM VALIDATION

    if (!tempRule.custom_date_format) {
      return "Please enter custom date format";
    }

    // basic format validation (production safe)
    const validPattern = /^[YMDHhms:\-/\sA]+$/;

    if (!validPattern.test(tempRule.custom_date_format)) {
      return "Invalid custom date format";
    }
  }
  ///
  if (tempRule.type === "data_redundant") {
    if (!tempRule.data_redundant_value) {
      return "Please enter redundant value";
    }

    if (!tempRule.data_redundant_threshold) {
      return "Please enter threshold. Threshold value should be >= 0";
    }
    if (tempRule.data_redundant_threshol < 0) {
      return "Threshold value must be >= 0";
    }
  }

  // ✅ Regex Validation
  if (tempRule.type === "regex") {
    if (tempRule.type === "regex") {
      if (!tempRule.cell_contains_value) {
        return "Please enter regex value";
      }
    }
    try {
      new RegExp(tempRule.cell_contains_value);
    } catch {
      return "Invalid regex pattern";
    }
  }

  if (tempRule.type === "fixed_header") {    
    if (!tempRule.fixed_header) {
      return "Please add at least one header value";
    }
  }
  if (tempRule.type === "cell_end_with") {
    if (!tempRule.cell_end_with || tempRule.cell_end_with.length === 0) {
      return "Please add at least one cell end with";
    }
  }
  if (tempRule.type === "cell_start_with") {
    if (!tempRule.cell_start_with) {
      return "Please add at least one cell start with";
    }
  }
  if (tempRule.type === "not_match_found") {
    if (!tempRule.not_match_found || tempRule.not_match_found.length === 0) {
      return "Please add at least one blocked word";
    }
  }
  if (tempRule.type === "dependency") {
    if (
      tempRule.dependency_mode === "other" &&
      !tempRule.other_value_main_dependency
    ) {
      return "Enter main dependency value";
    }

    if (!tempRule.sub_dependencies || tempRule.sub_dependencies.length === 0) {
      return "Add at least one sub dependency";
    }
  }

  //////

  // 👉 Move ALL your validations here (clean + testable)

  return null; // no error
};

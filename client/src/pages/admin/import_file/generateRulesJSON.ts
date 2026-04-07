// utils/ruleTransformer.ts

export const generateRulesJSON = (data: HeaderItem[]) => {
  const result: Record<string, any> = {};

  data.forEach((item) => {
    const obj: Record<string, any> = {
      name: item.name,
    };

    item.rules.forEach((rule) => {
      switch (rule.type) {
        case "required":
          obj.is_required = rule.value;
          break;

        case "data_type":
          obj.data_type = rule.value;
          break;

        case "data_length": {
          const val = rule.value;

          obj.length_validation_type = val.mode;

          if (val.mode === "fixed") {
            obj.min_length = val.fixed;
            obj.max_length = val.fixed;
          } else {
            obj.min_length = val.min;
            obj.max_length = val.max;
          }
          break;
        }

        case "date_format":
          obj.date_format = rule.value;
          break;

        case "data_redundant":
          obj.data_redundant_value = rule.value.data_redundant_value;
          obj.data_redundant_threshold = Number(
            rule.value.data_redundant_threshold,
          );
          break;

        case "regex":
          obj.cell_contains = true;
          obj.cell_contains_value = rule.value;
          break;

        case "fixed_header":
          obj.fixed_header = rule.value;
          break;

        case "cell_start_with":
          obj.cell_start_with = rule.value;
          break;

        case "cell_end_with":
          obj.cell_end_with = rule.value;
          break;

        case "not_match_found":
          obj.not_match_found = rule.value;
          break;

        case "dependency": {
          const dep: Record<string, any> = {};
          const main = rule.value;

          dep[item.name] = main.mode === "required" ? true : main.main_value;

          main.sub_dependencies?.forEach((sub: any) => {
            const key = sub.headers.join(",");
            dep[key] = sub.mode === "required" ? true : (sub.value ?? true);
          });

          obj.dependency = dep;
          break;
        }
      }
    });

    if (Object.keys(obj).length > 1) {
      result[item.name] = obj;
    }
  });

  return result;
};

// types.ts or inside ValidationRow.tsx
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";

export interface MultiValueProps {
  fixedHeaderInputs: Record<string, any>;
  cellStartWithInputs: Record<string, any>;
  cellEndWithInputs: Record<string, any>;
  notMatchFoundInputs: Record<string, any>;
  handleMultiValueRulesInputChange: (
    header: string,
    value: string,
    inputType: string,
  ) => void;
  addMultiValueRules: (
    header: string,
    fields: any[],
    append: any,
    inputType: string,
  ) => void;
  cancelMultiValueRules: (header: string, inputType: string) => void;
}

export interface FormHelpers {
  register: UseFormRegister<any>;
  watch: any;
  errors: FieldErrors<any>;
  control: Control<any>;
  trigger: UseFormTrigger<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export interface ValidationRowProps extends MultiValueProps, FormHelpers {
  header: { name: string };
  index: number;
  dataTypes: string[];
  date_format_options: string[];
  getRegexByType: (type: string) => string;
  default_length_validation_value: string;
  headersList: string[];
}

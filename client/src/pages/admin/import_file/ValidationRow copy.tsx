import React from "react";
import DataTypeSection from "./DataTypeSection";
import AllowEmpty from "./AllowEmpty";
import CellContainsSection from "./CellContainsSection";
import LengthValidation from "./LengthValidation";
import DataRedundantSection from "./DataRedundantSection";
import MultiValueRules from "./MultiValueRules";
import DependencyBuilder from "./DependencyBuilder";

interface HeaderValidationCardProps {
  header: any;
  index: number;
  register: any;
  watch: any;
  errors: any;
  control: any;
  trigger: any;
  dataTypes: any[];
  date_format_options: any[];
  getRegexByType: (type: string) => string;
  default_length_validation_value: string;
  fixedHeaderInputs: any[];
  cellStartWithInputs: any[];
  cellEndWithInputs: any[];
  notMatchFoundInputs: any[];
  handleMultiValueRulesInputChange: any;
  addMultiValueRules: any;
  cancelMultiValueRules: any;
}

const ValidationRow: React.FC<HeaderValidationCardProps> = ({
  header,
  index,
  register,
  watch,
  errors,
  control,
  trigger,
  dataTypes,
  date_format_options,
  getRegexByType,
  default_length_validation_value,
  fixedHeaderInputs,
  cellStartWithInputs,
  cellEndWithInputs,
  notMatchFoundInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
  setValue,
}) => {
  const formValues = watch();
  const headerValues = formValues?.[header.name] || {};
  const dataType = headerValues.data_type || "string";
  const validationType =
    headerValues.length_validation_type || default_length_validation_value;

  const multiValueRulesConfig = [
    { inputType: "fixed_header", inputs: fixedHeaderInputs },
    { inputType: "cell_start_with", inputs: cellStartWithInputs },
    { inputType: "cell_end_with", inputs: cellEndWithInputs },
    { inputType: "not_match_found", inputs: notMatchFoundInputs },
  ];

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-300 px-4 py-2 border-b">
        <h3 className="font-semibold text-gray-700">
          {index + 1}. {header.name}
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <DataTypeSection
          headerName={header.name}
          register={register}
          watch={watch}
          dataTypes={dataTypes}
          date_format_options={date_format_options}
        />
        <AllowEmpty headerName={header.name} register={register} />
        <CellContainsSection
          headerName={header.name}
          register={register}
          watch={watch}
          errors={errors}
          getRegexByType={getRegexByType}
          dataType={dataType}
          setValue={setValue}
        />
        <LengthValidation
          headerName={header.name}
          dataType={dataType}
          validationType={validationType}
          register={register}
          errors={errors}
        />
        <DataRedundantSection
          headerName={header.name}
          register={register}
          errors={errors}
          watch={watch}
        />
        {multiValueRulesConfig.map((rule) => (
          <MultiValueRules
            key={rule.inputType}
            headerName={header.name}
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            multiValueRulesInputs={rule.inputs}
            handleMultiValueRulesInputChange={handleMultiValueRulesInputChange}
            addMultiValueRules={addMultiValueRules}
            cancelMultiValueRules={cancelMultiValueRules}
            inputType={rule.inputType}
          />
        ))}
        <DependencyBuilder
          headerName={header.name}
          headersList={Object.keys(formValues || {})}
          control={control}
          register={register}
          watch={watch}
          trigger={trigger}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default ValidationRow;

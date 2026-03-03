import * as yup from "yup";

const registrationValidate = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters"),

  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain one uppercase letter")
    .matches(/[a-z]/, "Must contain one lowercase letter")
    .matches(/[0-9]/, "Must contain one number")
    .matches(/[@$!%*?&]/, "Must contain one special character"),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required") 
});

export default registrationValidate;

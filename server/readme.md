To do

2)add interceptor 3) authentication set for report 4) error message showin toaster 5) better design

1. npm install
2. npm run seed:admin

🔹 Frontend Axios
axios.post("http://localhost:5000/login", data, {
withCredentials: true
});

Without withCredentials: true, cookies will NOT be saved.

✅ Step 4: Access Cookie in Protected Route
const token = req.cookies.accessToken;
🚀 Production Version (Recommended)
res.cookie("accessToken", accessToken, {
httpOnly: true,
secure: process.env.NODE*ENV === "production",
sameSite: "strict",
maxAge: 24 * 60 \_ 60 \* 1000,
});

{"Id":{"data*type":"integer","has_empty":false,"length_validation_type":"variable","min_length":1,"max_length":1000,"cell_contains":true,"cell_contains_value":"^[0-9]\*$","dependency":{"Id":true,"Name":true,"Email":"aaa@yopmail.com"},"data_redundant_value":"1","data_redundant_threshold":5,"fixed_header":["1","2","3","4","5","6"],"date_format":"%Y*%m\_%d","cell_start_with":[1,2,3,4,5,6,7],"cell_end_with":[1,2,3,4,5,6,7],"not_match_found":["101","102"]},"Name":{"data_type":"Text","has_empty":false,"length_validation_type":"variable","min_length":1,"max_length":1000,"dependency":{"id":true,"email":true},"data_redundant_value":"1","data_redundant_threshold":1,"fixed_header":["ankita","margini","jenil","aasha","misha"],"cell_start_with":[],"cell_end_with":[],"not_match_found":["gmail","yahoo"]},"Email":{"data_type":"Email","has_empty":true,"length_validation_type":"variable","min_length":1,"max_length":1000,"data_redundant_value":"1","data_redundant_threshold":1,"not_match_found":["gmail"],"fixed_header":["ankita@yopmail.com","hita@yopmail.com","mira@yopmail.com","sumitra@yopmail.com","mansi@yopmail.com"],"cell_start_with":[],"cell_end_with":[]}}

[{"name":"Id","type":"Number","is_mandatory":true,"is_allow_duplicate":true,"min_length":1,"max_length":1000,"blocked_words":["101","102"],"predefined_values":["1","2","3","4","5","6"]},{"name":"Name","type":"Text","is_mandatory":true,"is_allow_duplicate":false,"block_special_chars":false,"allow_alpha_numeric":false,"not_allow_junk":true,"length_type":"fixed","min_length":5,"max_length":100,"blocked_words":["test"]},{"name":"email","type":"Email","is_mandatory":true,"is_allow_duplicate":true,"length_type":"variable","max_length":12345,"blocked_words":["gmail"],"predefined_values":["ankita@yopmail.com","hita@yopmail.com","mira@yopmail.com","sumitra@yopmail.com","mansi@yopmail.com"]}]

[{"name":"Id","type":"Number","is_mandatory":true,"is_allow_duplicate":false,"min_length":1,"max_length":14},{"name":"URL","type":"Text","is_mandatory":true,"is_allow_duplicate":true,"block_special_chars":false,"allow_alpha_numeric":true,"not_allow_junk":false,"length_type":"variable","max_length":1000,"blocked_words":["google","yahoo"]},{"name":"create_at","type":"Date","is_mandatory":true,"is_allow_duplicate":true,"min_date":"2026-03-01","max_date":"2026-03-31"},{"name":"Store_Type","type":"Text","is_mandatory":false,"is_allow_duplicate":true,"block_special_chars":false,"allow_alpha_numeric":false,"length_type":"variable","blocked_words":["Hotel"],"predefined_values":["Restaurants"]},{"name":"RecId","type":"Text","is_mandatory":false,"is_allow_duplicate":true,"block_special_chars":false,"allow_alpha_numeric":false,"length_type":"variable","max_length":1000,"predefined_values":["0a9d38186990cd56a81d52cb1f5cdc02"]},{"name":"BrandId","type":"Number","is_mandatory":false,"is_allow_duplicate":true,"min_length":0,"max_length":1000}]

{"Id":{"data*type":"integer","has_empty":false,"length_validation_type":"variable","min_length":1,"max_length":1000,"cell_contains":true,"cell_contains_value":"^[0-9]\*$","dependency":{"Id":1,"Name":1,"Email":2},"data_redundant_value":"1","data_redundant_threshold":5,"fixed_header":["1","2","3","4","5","6"],"date_format":"%Y*%m\_%d","cell_start_with":[1,2,3,4,5,6,7],"cell_end_with":[1,2,3,4,5,6,7],"not_match_found":["101","102"]},"Name":{"data_type":"Text","has_empty":false,"length_validation_type":"variable","min_length":1,"max_length":1000,"dependency":{"id":true,"email":true},"data_redundant_value":"1","data_redundant_threshold":1,"fixed_header":["ankita","margini","jenil","aasha","misha"],"cell_start_with":[],"cell_end_with":[],"not_match_found":["gmail","yahoo"]},"email":{"data_type":"Email","has_empty":false,"length_validation_type":"variable","min_length":1,"max_length":1000,"data_redundant_value":"1","data_redundant_threshold":1,"not_match_found":["gmail"],"fixed_header":["ankita@yopmail.com","hita@yopmail.com","mira@yopmail.com","sumitra@yopmail.com","mansi@yopmail.com"],"cell_start_with":[],"cell_end_with":[]}}

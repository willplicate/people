# 20-Week Applied AI/ML Analyst Curriculum

## What Does an Applied AI/ML Analyst Actually Do?

An Applied AI/ML Analyst sits at the intersection of data science, business strategy, and practical problem-solving. Unlike ML Engineers who build production infrastructure or Research Scientists who push theoretical boundaries, Applied AI/ML Analysts take real business problems and solve them with machine learning. Their day-to-day work involves: extracting messy data from databases using SQL, cleaning and preparing it for analysis, building predictive models to answer specific business questions (Will customers churn? What will sales be next month? Which users should we target?), and—critically—explaining their findings to non-technical stakeholders. They don't just build accurate models; they build interpretable models and communicate why the model made certain predictions, what features drive outcomes, and how much business value the solution provides. They compare different modeling approaches, run A/B tests to validate improvements, deploy models as interactive dashboards or APIs, and monitor performance over time to catch when models degrade. The role demands equal parts technical skill (Python, ML algorithms, statistics) and business acumen (translating technical metrics into ROI, presenting to executives, framing problems correctly). This curriculum is designed to build both capabilities: you'll learn the technical concepts through hands-on projects, but you'll also practice the communication, interpretation, and business thinking that separates good analysts from great ones.

---

## Curriculum Structure

**Pattern:** Learn concepts → Discuss project with Claude → Build with understanding → Document learning

**Each week follows this pattern:**
- **Monday-Tuesday:** Study assigned concepts (2-3 hours total)
- **Wednesday:** Discuss project idea with Claude (30 mins)
- **Thursday-Saturday:** Build project implementing concepts (6-8 hours)
- **Sunday:** Write learning article, update portfolio (2 hours)

---

## **Month 1: ML Fundamentals & First Model**

### **Week 1: Data Preparation Fundamentals**

**Core Concepts:**
1. **Features** - Input variables that help predict outcomes (e.g., study hours, energy level, day of week). Think of these as the "evidence" a model uses.
2. **Labels** - The thing you're trying to predict (e.g., did you skip studying: yes/no). This is the "answer" the model learns to predict.
3. **Data Types** - Numerical (1, 2.5, 100), categorical (Monday, Tuesday), text (notes, descriptions). Models handle each differently.
4. **Missing Data** - Empty cells in your dataset. Must be handled (fill with average, remove row, or flag as missing).
5. **EDA (Exploratory Data Analysis)** - Looking at your data before modeling: distributions, patterns, outliers, relationships between variables.

**Study Focus (Mon-Tue):**
- Search YouTube: "machine learning features and labels explained", "exploratory data analysis tutorial"
- Ask Gemini: "What's the difference between features and labels in ML with 3 real-world examples?" / "Why is EDA important before building models?" / "How do I handle missing data in datasets?"
- Read your data as a human first: What patterns do YOU see? What might predict your target variable?

**Practical Experiments (Wed-Sat):**
1. **Create structured data:** Build a CSV tracking a real behavior (study habits, exercise, spending, sleep). Include date, 3-5 features, 1 target label.
2. **Load and explore:** Use pandas to load CSV. Print first 5 rows, check for missing values, get column data types.
3. **Visualize patterns:** Create 3 plots - line chart (trend over time), histogram (distribution), scatter plot (relationship between 2 variables).
4. **Statistical summary:** Calculate mean, median, min, max for numerical columns. Count occurrences for categorical columns.
5. **Identify features:** Look at your data - which columns might help predict your label? Write down your hypothesis.

**Knowledge Check (Sunday):**
- Quiz prompt for Gemini: "Create 5 multiple choice questions about features, labels, and data types in machine learning"
- Write in own words: "Features are X. Labels are Y. In my project, I chose [columns] as features because..."
- Code challenge: Open your CSV, add a new feature column (e.g., is_weekend), verify it was added correctly.

**Portfolio Deliverable:** CSV with real data, Python script showing EDA, write 300 words: "How I Structured Data for ML: Features, Labels, and Why They Matter"

---

### **Week 2: Understanding Supervised Learning**

**Core Concepts:**
1. **Supervised Learning** - Model learns from labeled examples (you show it: these inputs → this output). Requires historical data with known answers.
2. **Unsupervised Learning** - Model finds patterns without labels (e.g., grouping similar customers). You don't tell it the "answer."
3. **Classification** - Predicting categories (spam/not spam, yes/no, red/blue/green). Output is a class label.
4. **Regression** - Predicting numbers (price, temperature, hours). Output is a continuous value.
5. **Training** - Process where model learns patterns from data by adjusting internal parameters to minimize errors.

**Study Focus (Mon-Tue):**
- Search YouTube: "supervised vs unsupervised learning", "classification vs regression explained"
- Ask Gemini: "Explain supervised learning with a simple example" / "When do I use classification vs regression?" / "What happens during model training?"
- Think about your problem: Are you predicting a category or a number? Why?

**Practical Experiments (Wed-Sat):**
1. **Build classification version:** Predict "will event happen?" (yes/no). Use simple if/then rules first (if hours < 2, predict skip).
2. **Build regression version:** Predict "how much?" (numerical value). Use simple rules (if yesterday was 3 hours, predict 3 hours today).
3. **Compare outputs:** Run both on same data. Classification gives categories, regression gives numbers. Document the difference.
4. **Calculate accuracy:** For classification - what % of yes/no predictions were correct? For regression - how far off were number predictions (average error)?
5. **Evaluate usefulness:** Which prediction type is more useful for your problem? Why?

**Knowledge Check (Sunday):**
- Quiz prompt: "Give me questions distinguishing classification from regression problems"
- Identify problem types: "Customer will churn?" (classification), "Revenue next month?" (regression), "Movie rating 1-5?" (could be either)
- Code challenge: Modify your rule-based predictor to use different thresholds. Does accuracy change?

**Portfolio Deliverable:** Two prediction systems (classification + regression), comparison analysis, write 300 words: "Classification vs Regression: When to Predict Categories vs Numbers"

---

### **Week 3: Train/Test Split & First ML Model**

**Core Concepts:**
1. **Train/Test Split** - Divide data: use 70% to teach model, 30% to test it. Model never sees test data during training.
2. **Why Split?** - Testing on training data is cheating. Model memorizes answers instead of learning patterns. Split reveals true performance.
3. **Overfitting** - Model performs great on training data but poorly on new data. It memorized specifics instead of learning general patterns.
4. **Underfitting** - Model performs poorly on both training and test data. It's too simple to capture patterns.
5. **Logistic Regression** - Algorithm for binary classification. Finds linear boundary between classes. Simple, fast, interpretable.

**Study Focus (Mon-Tue):**
- Search YouTube: "train test split explained", "logistic regression intuition", "overfitting vs underfitting"
- Ask Gemini: "Why can't I test my model on the same data I trained it on?" / "What is overfitting and why is it bad?" / "When should I use Logistic Regression?"
- Key insight: Your model needs to work on future data, not just past data.

**Practical Experiments (Wed-Sat):**
1. **Split your data:** First 70% = training, last 30% = testing (chronological split for time-based data).
2. **Train Logistic Regression:** Use sklearn to fit model on training data only. Don't look at test data yet.
3. **Predict on training data:** Check accuracy. It should be reasonably high.
4. **Predict on test data:** Check accuracy. Compare to training accuracy. Are they similar?
5. **Intentionally overfit:** Train a very complex model (or train too long). See training accuracy hit 100% while test accuracy stays low. This is overfitting in action.

**Knowledge Check (Sunday):**
- Quiz prompt: "Test me on train/test split concepts and overfitting"
- Explain: "If training accuracy is 98% but test accuracy is 65%, what's happening?"
- Code challenge: Change train/test split to 80/20. Does test accuracy change? Why?

**Portfolio Deliverable:** Working Logistic Regression model with train/test split, comparison of train vs test accuracy, write 300 words: "Why I Can't Test on Training Data: My First Real ML Model"

---

### **Week 4: Model Comparison & Ensemble Methods**

**Core Concepts:**
1. **Decision Trees** - Model makes decisions using if/then rules in a tree structure. Easy to visualize and explain. Can overfit easily.
2. **Random Forest** - Combines many decision trees (ensemble). Each tree votes, majority wins. More accurate than single trees, harder to overfit.
3. **Ensemble Learning** - Combining multiple models to get better predictions than any single model. "Wisdom of crowds" for ML.
4. **Hyperparameters** - Settings you choose before training (max_depth, n_estimators). Unlike model parameters, these aren't learned from data.
5. **Model Selection** - Comparing multiple algorithms to find which works best for your specific problem and data.

**Study Focus (Mon-Tue):**
- Search YouTube: "decision trees explained", "random forest intuition", "ensemble learning"
- Ask Gemini: "How does a Decision Tree make predictions?" / "Why is Random Forest usually better than a single Decision Tree?" / "What are hyperparameters vs parameters?"
- Understand: More complex ≠ always better. Sometimes simpler models generalize better.

**Practical Experiments (Wed-Sat):**
1. **Train Decision Tree:** Use same train/test split. Compare accuracy to Logistic Regression.
2. **Visualize the tree:** Plot decision tree (sklearn has tools for this). See the actual if/then rules it learned.
3. **Train Random Forest:** Start with default settings. Compare to Decision Tree and Logistic Regression.
4. **Tune hyperparameters:** Try Random Forest with max_depth=3 vs max_depth=20. Which overfits? Which is better on test data?
5. **Compare all three models:** Create table showing train accuracy and test accuracy for Logistic Regression, Decision Tree, Random Forest. Which would you choose and why?

**Knowledge Check (Sunday):**
- Quiz prompt: "Test my understanding of Decision Trees, Random Forests, and model comparison"
- Explain overfitting: "My Random Forest got 100% training accuracy but only 70% test accuracy because..."
- Code challenge: Train a Random Forest with only 3 trees (n_estimators=3). Compare to 100 trees. What changes?

**Portfolio Deliverable:** Three trained models with comparison table, decision tree visualization, write 300 words: "Why My Random Forest Beat Logistic Regression (And When It Wouldn't)"

---

## **Month 2: Feature Engineering & Evaluation**

### **Week 5: Feature Engineering Fundamentals**

**Core Concepts:**
1. **Feature Engineering** - Creating new input variables from existing data to help models learn better. Often more impactful than choosing algorithms.
2. **Derived Features** - Mathematical combinations of existing features (ratios, differences, products). Example: BMI from height and weight.
3. **Time-Based Features** - day_of_week, is_weekend, hour_of_day, month. Captures temporal patterns models can't see in raw timestamps.
4. **Lag Features** - Previous values (yesterday's price, 7-day average). Crucial for time series and sequential data.
5. **Categorical Encoding** - Converting categories (Red, Blue, Green) to numbers models can use. One-hot encoding creates binary columns for each category.

**Study Focus (Mon-Tue):**
- Search YouTube: "feature engineering explained", "one hot encoding", "time series feature engineering"
- Ask Gemini: "What makes a good engineered feature?" / "How does one-hot encoding work?" / "Why do we create lag features?"
- Think creatively: What hidden patterns could you expose through feature combinations?

**Practical Experiments (Wed-Sat):**
1. **Add time features:** Create is_weekend, day_of_week, month columns from your dates.
2. **Create lag features:** Add yesterday's value, 3-day average, 7-day average columns.
3. **Engineer domain-specific features:** Based on your problem, create meaningful combinations (e.g., hours_studied / energy_level = "effort ratio").
4. **One-hot encode categories:** If you have categorical features, convert to binary columns.
5. **Retrain with new features:** Use same models from Week 4. Did accuracy improve? Which new features helped most?

**Knowledge Check (Sunday):**
- Quiz prompt: "Create questions about feature engineering and categorical encoding"
- Explain improvement: "Adding [feature] improved my model accuracy from X% to Y% because..."
- Code challenge: Remove your best feature and retrain. How much does performance drop?

**Portfolio Deliverable:** Enhanced dataset with 5+ engineered features, before/after comparison, write 300 words: "How Feature Engineering Improved My Model by 15%"

---

### **Week 6: Evaluation Metrics Deep Dive**

**Core Concepts:**
1. **Confusion Matrix** - 2x2 table showing True Positives, False Positives, True Negatives, False Negatives. Reveals where your model makes mistakes.
2. **Precision** - Of all positive predictions, how many were correct? (TP / TP+FP). Matters when false positives are costly.
3. **Recall** - Of all actual positives, how many did we catch? (TP / TP+FN). Matters when false negatives are costly.
4. **F1-Score** - Harmonic mean of precision and recall. Single metric balancing both. Good for imbalanced datasets.
5. **Class Imbalance** - When one class dominates (90% no, 10% yes). Accuracy becomes misleading. Need precision/recall/F1.

**Study Focus (Mon-Tue):**
- Search YouTube: "confusion matrix explained", "precision vs recall", "F1 score intuition"
- Ask Gemini: "Explain precision and recall with a medical diagnosis example" / "When is accuracy misleading?" / "What is class imbalance?"
- Real scenario: Would you rather miss a fraud case (low recall) or flag innocent transactions (low precision)?

**Practical Experiments (Wed-Sat):**
1. **Calculate class distribution:** What % of your data is each class? Is it imbalanced (e.g., 90/10)?
2. **Create confusion matrix:** For your best model, visualize TP, FP, TN, FN as a heatmap.
3. **Calculate precision, recall, F1:** Use sklearn.metrics for each. Which metric is lowest? Why?
4. **Baseline comparison:** What accuracy would you get always predicting the majority class? Is your model better than this dumb baseline?
5. **Adjust decision threshold:** If predict_proba gives 0.48, do you predict yes or no? Try different thresholds (0.3, 0.5, 0.7). How do precision and recall change?

**Knowledge Check (Sunday):**
- Quiz prompt: "Test me on confusion matrices, precision, recall, and F1-score"
- Explain tradeoff: "Increasing my prediction threshold from 0.5 to 0.7 increased precision but decreased recall because..."
- Code challenge: Create a model that achieves 100% recall (predict everything as positive). What happens to precision?

**Portfolio Deliverable:** Confusion matrix visualization, precision/recall/F1 analysis, write 300 words: "Why My 90% Accurate Model Was Actually Terrible: Understanding Class Imbalance"

---

### **Week 7: Cross-Validation & Model Selection**

**Core Concepts:**
1. **Cross-Validation** - Split data into K folds, train on K-1, test on 1, rotate. Repeat K times. More reliable than single train/test split.
2. **K-Fold CV** - Most common approach (K=5 or K=10). Each data point gets to be in test set exactly once.
3. **Validation Set** - Three-way split: train (60%), validation (20%), test (20%). Validation for hyperparameter tuning, test for final evaluation.
4. **Bias-Variance Tradeoff** - High bias = underfitting (too simple), high variance = overfitting (too complex). Need balance.
5. **Model Selection Process** - Use cross-validation to compare models fairly. Choose based on validation performance. Report test performance once.

**Study Focus (Mon-Tue):**
- Search YouTube: "cross validation explained", "bias variance tradeoff", "train validation test split"
- Ask Gemini: "Why is cross-validation better than a single train/test split?" / "What's the difference between validation and test sets?" / "Explain bias-variance tradeoff simply"
- Key insight: Single split can be lucky/unlucky. Cross-validation averages out the luck.

**Practical Experiments (Wed-Sat):**
1. **Implement 5-fold CV:** Use sklearn's cross_val_score on your models. Get 5 accuracy scores instead of 1.
2. **Compare average CV scores:** For Logistic Regression, Decision Tree, Random Forest. Which has highest average? Lowest variance?
3. **Hyperparameter tuning:** Try Random Forest with different max_depth (3, 5, 10, 20). Use CV to find best. This is your validation process.
4. **Final test evaluation:** After choosing best model via CV, train on all training data, evaluate once on held-out test set.
5. **Analyze variance:** If your 5 CV scores are [0.85, 0.87, 0.72, 0.90, 0.88], the 0.72 suggests model performance depends on which data it sees. Why?

**Knowledge Check (Sunday):**
- Quiz prompt: "Create questions about cross-validation and model selection"
- Explain process: "I used cross-validation to choose between models, then evaluated once on test data because..."
- Code challenge: Implement 3-fold CV manually (without cross_val_score). Split data 3 ways, train 3 times, average scores.

**Portfolio Deliverable:** Cross-validation comparison of multiple models, hyperparameter tuning results, write 300 words: "Why I Stopped Trusting Single Train/Test Splits"

---

### **Week 8: Gradient Boosting & Advanced Algorithms**

**Core Concepts:**
1. **Gradient Descent** - Optimization algorithm that iteratively adjusts model parameters to minimize error. Takes small steps downhill toward best solution.
2. **Gradient Boosting** - Builds models sequentially. Each new model corrects errors of previous models. Combines weak learners into strong learner.
3. **XGBoost/LightGBM** - Optimized implementations of gradient boosting. Industry standard for tabular data competitions. Fast, accurate, handles missing data.
4. **Learning Rate** - Controls size of steps during training. Too high = unstable, too low = slow convergence. Hyperparameter to tune.
5. **Regularization** - Penalties added to loss function to prevent overfitting. L1 (Lasso) can zero out features. L2 (Ridge) shrinks coefficients.

**Study Focus (Mon-Tue):**
- Search YouTube: "gradient descent visualization", "XGBoost explained", "L1 vs L2 regularization"
- Ask Gemini: "How does gradient descent find optimal parameters?" / "What's the difference between Random Forest and XGBoost?" / "When do I use L1 vs L2 regularization?"
- Understand: Boosting builds sequentially (correcting mistakes), bagging builds in parallel (Random Forest).

**Practical Experiments (Wed-Sat):**
1. **Train XGBoost:** Use default settings first. Compare to Random Forest from Week 4.
2. **Tune learning rate:** Try learning_rate of 0.01, 0.1, 0.3. Too high and model unstable, too low and it trains slowly.
3. **Tune number of trees:** Try n_estimators of 10, 50, 100, 500. Plot training and test accuracy. Where does overfitting start?
4. **Add regularization:** Try different reg_alpha (L1) and reg_lambda (L2) values. Does it prevent overfitting?
5. **Feature importance:** XGBoost calculates which features matter most. Compare to Random Forest feature importance. Do they agree?

**Knowledge Check (Sunday):**
- Quiz prompt: "Test me on gradient boosting, XGBoost, and regularization"
- Explain difference: "XGBoost beat Random Forest because it [builds sequentially/corrects errors/other reason]"
- Code challenge: Train XGBoost with very high learning_rate (e.g., 1.0). What happens to training curve?

**Portfolio Deliverable:** XGBoost model with tuned hyperparameters, comparison to previous models, write 300 words: "How XGBoost Became My Go-To Algorithm for Tabular Data"

---

## **Month 3: Model Interpretability & Deployment**

### **Week 9: Model Interpretability with SHAP**

**Core Concepts:**
1. **Model Interpretability** - Explaining WHY a model made a prediction. Critical for business trust, debugging, and regulatory compliance.
2. **SHAP (SHapley Additive exPlanations)** - Shows contribution of each feature to a specific prediction. Based on game theory.
3. **Feature Contributions** - For one prediction, SHAP shows: Feature A added +0.3, Feature B subtracted -0.1 to final prediction.
4. **Global vs Local Explanations** - Global: which features matter most overall. Local: why this specific prediction was made this way.
5. **Waterfall Plots** - Visualizes how features push prediction from baseline up or down to final value.

**Study Focus (Mon-Tue):**
- Search YouTube: "SHAP values explained", "model interpretability", "explainable AI"
- Ask Gemini: "What are SHAP values and why do we need them?" / "What's the difference between global and local explanations?" / "When is model interpretability critical?"
- Real scenario: Can you explain to a business stakeholder WHY customer X was predicted to churn?

**Practical Experiments (Wed-Sat):**
1. **Install SHAP:** pip install shap. Calculate SHAP values for your trained model.
2. **Global importance:** Create SHAP summary plot showing which features matter most across all predictions.
3. **Local explanation:** Pick one prediction. Create waterfall plot showing how each feature contributed to that specific prediction.
4. **Compare to feature importance:** Do SHAP values agree with your model's feature_importance_? Differences reveal how features interact.
5. **Business translation:** For one prediction, write in plain English: "The model predicted X because [feature A was high] and [feature B was low]"

**Knowledge Check (Sunday):**
- Quiz prompt: "Create questions about SHAP and model interpretability"
- Explain: "SHAP values help me explain predictions by showing..."
- Code challenge: Find the prediction where one feature had the biggest positive SHAP value. Why was this feature so influential for that case?

**Portfolio Deliverable:** SHAP visualizations (global + local), interpreted predictions in business terms, write 300 words: "Making My Black Box Transparent: Explaining Predictions with SHAP"

---

### **Week 10: ROC Curves & Probability Calibration**

**Core Concepts:**
1. **Prediction Probabilities** - Models can output probabilities (0.73 chance of yes) not just binary predictions. More informative than yes/no.
2. **ROC Curve (Receiver Operating Characteristic)** - Plots True Positive Rate vs False Positive Rate at all possible thresholds. Shows model discrimination ability.
3. **AUC (Area Under ROC Curve)** - Single number summarizing ROC curve. 1.0 = perfect, 0.5 = random guessing. Generally: >0.9 excellent, 0.7-0.8 acceptable.
4. **Threshold Selection** - Default is 0.5 but you can adjust. Lower threshold = more positives predicted (higher recall, lower precision).
5. **Probability Calibration** - Do predicted probabilities match reality? If model says 70%, do 70% of those cases actually occur?

**Study Focus (Mon-Tue):**
- Search YouTube: "ROC curve explained", "AUC interpretation", "classification threshold"
- Ask Gemini: "What does ROC curve show me?" / "How do I interpret AUC scores?" / "When should I adjust the classification threshold?"
- Understand: ROC/AUC evaluates model's ability to rank predictions, independent of threshold choice.

**Practical Experiments (Wed-Sat):**
1. **Get probabilities:** Use predict_proba() instead of predict(). See probability for each prediction.
2. **Plot ROC curve:** Use sklearn.metrics.roc_curve and roc_auc_score. Visualize curve, calculate AUC.
3. **Compare models:** Plot ROC curves for Logistic Regression, Random Forest, XGBoost on same chart. Which has highest AUC?
4. **Adjust threshold:** Try thresholds of 0.3, 0.5, 0.7 for classification. How do precision, recall, and F1 change? Plot precision-recall vs threshold.
5. **Find optimal threshold:** For your business problem, what threshold balances precision and recall best?

**Knowledge Check (Sunday):**
- Quiz prompt: "Test my understanding of ROC curves, AUC, and probability thresholds"
- Interpret AUC: "My model's AUC of 0.85 means..."
- Code challenge: Create a deliberately bad model (predict randomly). Plot its ROC curve. Is AUC close to 0.5?

**Portfolio Deliverable:** ROC curves comparing models, threshold analysis, write 300 words: "Beyond Binary Predictions: Using Probabilities and ROC Curves"

---

### **Week 11: Model Deployment Basics**

**Core Concepts:**
1. **Model Serialization** - Saving trained model to file (pickle, joblib) so you can load and use it later without retraining.
2. **API (Application Programming Interface)** - How applications request predictions from your model. Send input, get prediction back.
3. **Streamlit** - Python library for building ML web apps quickly. Converts Python script to interactive dashboard.
4. **Model Versioning** - Tracking which model version is deployed. Important when you retrain/improve models.
5. **Production Environment** - Where real users access your model. Different from development (your laptop). Needs to be reliable, fast, monitored.

**Study Focus (Mon-Tue):**
- Search YouTube: "deploying machine learning models", "Streamlit tutorial", "model serialization"
- Ask Gemini: "What is model serialization and why do we need it?" / "How do deployed ML models serve predictions?" / "What's the difference between development and production?"
- Think about: How would a non-technical user interact with your model?

**Practical Experiments (Wed-Sat):**
1. **Save your model:** Use joblib to save best model to file. Load it in new script. Make predictions without retraining.
2. **Build Streamlit app:** Create app.py that loads model, takes user inputs, displays prediction.
3. **Add input validation:** What if user enters negative hours? Handle edge cases gracefully.
4. **Visualize in app:** Show prediction probability, add charts explaining features or SHAP values.
5. **Deploy to Streamlit Cloud:** Push to GitHub, deploy on Streamlit Cloud. Share link - it's now accessible to anyone.

**Knowledge Check (Sunday):**
- Quiz prompt: "Create questions about model deployment and APIs"
- Explain: "Model serialization lets me..."
- Code challenge: Save two different models (Logistic Regression and XGBoost). Build app that lets user choose which model to use.

**Portfolio Deliverable:** Deployed Streamlit app (live URL), write 300 words: "From Jupyter Notebook to Production: Deploying My First ML App"

---

### **Week 12: A/B Testing & Model Monitoring**

**Core Concepts:**
1. **A/B Testing** - Comparing two approaches (model A vs model B) by randomly assigning users and measuring outcomes. Gold standard for validation.
2. **Statistical Significance** - Is difference between A and B real or just random chance? Use p-values and confidence intervals.
3. **Sample Size** - Need enough data to detect meaningful differences. Small samples = high variance, hard to detect real effects.
4. **Model Monitoring** - Tracking deployed model performance over time. Accuracy can degrade as world changes.
5. **Data Drift** - When new data distribution differs from training data. Features or target can drift. Causes performance degradation.

**Study Focus (Mon-Tue):**
- Search YouTube: "A/B testing explained", "statistical significance", "data drift machine learning"
- Ask Gemini: "How do I run an A/B test for ML models?" / "What is statistical significance in simple terms?" / "What causes model performance to degrade over time?"
- Real scenario: You improved your model's accuracy from 80% to 82%. Is that real improvement or random fluctuation?

**Practical Experiments (Wed-Sat):**
1. **Simulate A/B test:** Take your test data. Randomly assign half to Model A (Logistic Regression), half to Model B (XGBoost). Compare accuracy.
2. **Calculate significance:** Use statistical test (t-test or chi-square). Is difference significant at p < 0.05?
3. **Sample size impact:** Run A/B test with 10 samples, then 100, then full test set. How does confidence in results change?
4. **Monitor over time:** Simulate model degradation - use model trained on first half of data, test on increasingly distant time periods. Does accuracy drop?
5. **Detect drift:** Compare feature distributions in train vs recent test data. Are means, standard deviations changing?

**Knowledge Check (Sunday):**
- Quiz prompt: "Test me on A/B testing, significance, and model monitoring"
- Explain: "To know if model B is truly better than model A, I need to..."
- Code challenge: Intentionally create data drift (shift feature distributions). Retrain model on new data. How much does accuracy change?

**Portfolio Deliverable:** A/B test results with significance testing, model monitoring dashboard, write 300 words: "Proving My New Model Is Actually Better: A/B Testing in Practice"

---

## **Month 4: SQL & Business Analytics**

### **Week 13: SQL Fundamentals for ML**

**Core Concepts:**
1. **SQL (Structured Query Language)** - Language for querying databases. Essential for extracting data before ML. Most business data lives in databases, not CSV files.
2. **Joins** - Combining tables: INNER (only matches), LEFT (all from left + matches), RIGHT (all from right + matches), FULL (everything).
3. **Aggregations** - Summarizing data: COUNT, SUM, AVG, MIN, MAX with GROUP BY. Turns detailed records into summary statistics.
4. **Window Functions** - Calculate running totals, rankings, moving averages without collapsing rows. ROW_NUMBER, RANK, LAG, LEAD.
5. **Subqueries** - Query inside a query. Useful for complex filters or creating derived tables.

**Study Focus (Mon-Tue):**
- Search YouTube: "SQL joins explained", "SQL window functions", "SQL for data science"
- Ask Gemini: "Explain the difference between INNER JOIN and LEFT JOIN with examples" / "What are window functions and when do I use them?" / "How do I use SQL to create ML features?"
- SQL is declarative: You say WHAT you want, database figures out HOW to get it.

**Practical Experiments (Wed-Sat):**
1. **Set up database:** Use SQLite (local database, no server needed). Import your CSV or find multi-table dataset.
2. **Basic queries:** SELECT specific columns, WHERE to filter, ORDER BY to sort. Get comfortable with syntax.
3. **Aggregations:** GROUP BY a categorical column, calculate COUNT and AVG for each group. These become features.
4. **Window functions:** Calculate 7-day rolling average using window function. Create lag features (previous row's value).
5. **Joins for features:** If you have multiple tables (users, purchases, behavior), JOIN them to create ML-ready flat table with features from each.

**Knowledge Check (Sunday):**
- Quiz prompt: "Create SQL quiz questions on joins, aggregations, and window functions"
- Explain: "I used a LEFT JOIN instead of INNER JOIN because..."
- Code challenge: Write query to calculate: for each user, their total purchases, average purchase amount, and days since last purchase.

**Portfolio Deliverable:** SQL queries creating ML features, joined dataset, write 300 words: "From Database to Model: Using SQL for Feature Engineering"

---

### **Week 14: Unsupervised Learning -
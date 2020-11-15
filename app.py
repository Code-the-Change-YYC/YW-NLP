import requests

from server.risk_scores.risk_assessment import get_risk_assessment
from fastapi import FastAPI, HTTPException

from models.cnb_model import CNBDescriptionClf
from server.schemas.predict import PredictIn, PredictOut
from server.schemas.submit import SubmitOut, SubmitIn

app = FastAPI()
clf = CNBDescriptionClf()

SANITY_READ_TOKEN = 'skagnXfvkArS8Su6sEsTxpvQWB0bNBKS8X6RUr3Y6ytzOT1wg1VH6vF75EPY7JYKjZNcfMYdrCIfTIGq5DEFVBuOS8sOVus6j3ntfvcWnZ5rzFEKfsWLkApp0CU8SMUQFq6zeWKWiTGx0H0prFkP24Cud9n25B6jP9c2q1jxMpGlaS1o9pXL'
SANITY_GQL_ENDPOINT = 'https://olnd0a1o.api.sanity.io/v1/graphql/production/default'

formQuery = """
    {
        CirForm(id: "cirForm") {
            primaryIncTypes
        }
    }
"""

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': f'Bearer {SANITY_READ_TOKEN}',
}


def run_query(uri, query, headers):
    request = requests.post(uri, json={'query': query}, headers=headers)
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception(
            f"Unexpected status code returned: {request.status_code}")


@app.get("/")
async def index():
    return {"Hello": "World"}


@app.post("/api/predict/", response_model=PredictOut)
async def predict(predict_in: PredictIn) -> PredictOut:
    """Predict most probable incident types from input string.

    Args:
        predict_in (PredictIn): Input text and number of predictions to return.

    Returns:
        PredictMultiOut: JSON containing input text and predictions with their
        probabilities.
    """
    inc_types = run_query(SANITY_GQL_ENDPOINT, formQuery, headers)['data']['CirForm']['primaryIncTypes']
    input_string = predict_in.text
    num_predictions = predict_in.num_predictions
    [predictions] = clf.predict_multiple([input_string], num_predictions)
    predictions = [(pred[0].value, pred[1]) for pred in predictions]
    predictions = list(filter(lambda pred: pred[0] in inc_types, predictions))
    return PredictOut(input_text=input_string, predictions=predictions)


@app.post("/api/submit/", response_model=SubmitOut)
async def submit_form(form: SubmitIn) -> SubmitOut:
    """Submit JSON form data from front end.

    Args:
        form (SubmitIn)

    Returns:
        SubmitOut: Request data alongside risk score.
    """
    try:
        risk_assessment = get_risk_assessment(form.form_fields)
    except KeyError as ke:
        raise HTTPException(
            422, detail={"error": f"Incorrect request parameter/key: {ke}"}
        )
    return SubmitOut(form_fields=form.form_fields, risk_assessment=risk_assessment.value)

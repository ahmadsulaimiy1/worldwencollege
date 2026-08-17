// GET /api/verify/<code>
//
// PUBLIC. No authentication, no account, no identification of the
// checker — deliberately, and it is the property the whole portal rests
// on. A credential that requires the person checking it to register is a
// credential nobody checks, and a log of who checked would create a
// personal-data holding the College could not defend the purpose of.
//
// Every attempt is recorded (the code, the time, the outcome) so a
// graduate can see their award has been verified and the College can see
// somebody walking the register. Nothing about the checker is kept.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { verifyCode } from '../../_lib/registry/awards.js';

export async function onRequestGet({ params, request, env }) {
  try {
    // A QR scan lands with ?via=qr. It changes nothing about the answer;
    // it distinguishes a scan from a typed code in the College's own
    // statistics, which is worth knowing when deciding whether to keep
    // printing codes at all.
    const via = new URL(request.url).searchParams.get('via');
    const channel = via === 'qr' ? 'qr' : 'public';
    const result = await verifyCode(env, { code: params.code, channel });

    // 200 for every well-formed answer, including "withdrawn" and "no
    // such code". Those are ANSWERS, not errors: a checker asked a
    // question and got a true reply. Returning 404 would make an
    // ordinary negative look like a broken endpoint, and integrators
    // would start treating a real withdrawal as an outage.
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

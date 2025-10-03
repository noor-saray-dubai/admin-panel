import { Suspense } from "react"
import { LuxurySignIn } from "../../components/luxury-signin"

export default function LoginPage() {
  return(
       <div>
              <Suspense fallback={<></>}>
                <LuxurySignIn />
            </Suspense>
            </div>
  ) 
}
  
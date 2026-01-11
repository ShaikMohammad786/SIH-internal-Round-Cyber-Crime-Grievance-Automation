import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { isAuthenticated, getUser } from "../utils/auth";
import { FileText, Activity, ShieldCheck, ArrowRight, CheckCircle, Clock, Shield } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const handleReportCase = () => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user && user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/register-case');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-slate-900 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
        
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Report Scams. <br />
            <span className="text-indigo-400">Protect Others.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Join our secure platform to report fraud incidents, track case progress,
            and help authorities take swift action against scammers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button 
              onClick={handleReportCase}
              className="group flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:-translate-y-0.5"
            >
              Report a Case <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            {/* Additional buttons can be added here if needed */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-lg grid-cols-1 gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {[
              { id: 1, value: "1,247", label: "Cases Reported", icon: FileText },
              { id: 2, value: "89%", label: "Resolution Rate", icon: CheckCircle },
              { id: 3, value: "24hr", label: "Average Response", icon: Clock },
              { id: 4, value: "₹2.4Cr", label: "Fraud Prevented", icon: Shield },
            ].map((stat) => (
              <div key={stat.id} className="flex flex-col gap-y-3 border-l border-slate-200 pl-6 transition-all hover:border-indigo-600">
                <dt className="text-base leading-7 text-slate-600">{stat.label}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 sm:py-32 bg-slate-50" id="how">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How Scam Reporter Works</p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Our platform provides a secure, streamlined process to report fraud and
              coordinate with authorities for swift action.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: 'Report Incidents',
                  description: 'Securely document scam details with our guided reporting system.',
                  icon: FileText,
                },
                {
                  name: 'Track Progress',
                  description: 'Monitor your case status through our transparent timeline system.',
                  icon: Activity,
                },
                {
                  name: 'Authority Coordination',
                  description: 'Automatically generate reports for police, banks, and telecom authorities.',
                  icon: ShieldCheck,
                },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md hover:ring-indigo-200">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Been Scammed? Don't Wait.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Time is critical in fraud cases. Report your incident now and let us help
            you coordinate with the right authorities for maximum recovery chances.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={handleReportCase}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Your Report
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs leading-5 text-slate-400">
              &copy; 2025 Scam Reporter. Protecting communities from fraud.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

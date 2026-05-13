import { useJobHunter } from './hooks/useJobHunter';
import { SCREENS } from '../../components/jobfinder/constants';
import { AnalyzingScreen } from '../../components/jobfinder/Analyzingscreen';
import { UploadScreen } from '../../components/jobfinder/Uploadscreen';
import { ResultsScreen } from '../../components/jobfinder/ResultsScreen';

const JobFinder = () => {
    const {
        screen,
        file,
        candidate,
        jobs,
        error,
        stepMsg,
        startAnalysis,
        reset,
    } = useJobHunter();

    if (screen === SCREENS.ANALYZING) {
        return <AnalyzingScreen stepMsg={stepMsg} />;
    }

    if (screen === SCREENS.RESULTS && candidate) {
        return (
            <ResultsScreen
                candidate={candidate}
                jobs={jobs}
                fileName={file?.name ?? null}
                onReset={reset}
            />
        );
    }

    // default: SCREENS.UPLOAD
    return (
        <UploadScreen
            onAnalyze={startAnalysis}
            error={error}
        />
    );
}

export default JobFinder